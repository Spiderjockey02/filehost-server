import type { UserWithPlan } from '@/types/database/User';
import type { File } from '@/types/generated/client';
import prismaClient from '@/accessors/prisma';
import Client from './Client';

export default class TrashHandler {
	client: Client;
	constructor(client: Client) {
		this.client = client;
	}

	/**
	  * Move a file to the trash
	  * @param {UserWithPlan} user The user
	  * @param {string} fileId The file Id
	*/
	async moveToTrash(user: UserWithPlan, fileId: string) {
		const file = await this.client.FileManager.fetchById(fileId);
		if (file == null) throw 'The specified file does not exist.';

		// Check the owner of the file and folder
		if (file.userId !== user.id) throw 'You do not have permission to delete this file.';

		// Check if the file is already in the trash
		if (file.deletedAt != null) throw 'File already in the trash';

		// Calculate how long the file should stay in the trash before being removed
		const dateToDelete = new Date();
		dateToDelete.setDate(dateToDelete.getDate() + user.plan.deletedFileRetentionDays);

		const fileUpdates: { id: string; deletedAt: Date | null }[] = [];

		// Start transaction
		try {
			await prismaClient.$transaction(async (tx) => {
				await tx.file.update({
					where: { id: file.id },
					data: { deletedAt: dateToDelete },
				});

				// Delete caches
				this.client.FileManager.cache.delete(`${file.userId}_${file.path}`);

				// Update their parent's cached version aswell
				const parentFile = await this.client.FileManager.fetchById(file.parentId);
				if (parentFile) this.client.FileManager.cache.delete(`${file.userId}_${parentFile.path}`);

				// Carry on managing other files and fallback system
				fileUpdates.push({ id: file.id, deletedAt: null });
				if (file.type === 'DIRECTORY') {
					const children = await this.client.FileManager.fetchChildrenByParentId(file.id);

					for (const child of children.filter(c => c.deletedAt == null)) {
						await this.moveToTrash(user, child.id);
					}
				}
			});
		} catch (err) {
			for (const change of fileUpdates) {
				await this.client.FileManager.update({
					id: change.id,
					deletedAt: change.deletedAt,
				});
			}

			throw new Error(`Failed to move to trash: ${err}`);
		}

		return file;
	}

	/**
	 * Restore a deleted file back the user's directory
	 * @param {string} userId The user ID
	 * @param {string} fileId The file Id
	 * @returns {File} The updated file
	 */
	async restoreFile(userId: string, fileId: string): Promise<File> {
		const file = await this.client.FileManager.fetchById(fileId);
		if (file == null) throw 'The specified file does not exist.';
		if (userId !== file.userId) throw 'You do not have permission to restore this file.';
		if (file.deletedAt == null) throw 'File is not in the trash.';

		// Update the current file/folder in the database
		await this.client.FileManager.update({
			id: file.id,
			deletedAt: null,
		});

		// If it's a folder, process its children
		if (file.type === 'DIRECTORY') {
			const children = await this.client.FileManager.fetchChildrenByParentId(file.id);

			// Move all child files/subfolders (make sure no children are already restored)
			for (const child of children.filter(f => f.deletedAt !== null)) {
				await this.restoreFile(userId, child.id);
			}
		}

		this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
			await this.client.AuditLogManager.create({
				eventName: 'FILE_RECOVERED',
				resourceType: 'FILE',
				resourceId: file.id,
				success: true,
				userId: file.userId,
				message: 'Successfully recovered file.',
			});
		});

		return file;
	}

	/**
	  * Restore a user's entire deleted files
	  * @param {string} userId The user ID
		* @returns {boolean} The result of the operation
	*/
	async emptyTrash(userId: string): Promise<boolean> {
		const filesInTrash = await this.client.FileManager.fetchOwnedByUserId({ userId, isDeleted: true });

		try {
			const { count } = await this.client.FileManager.updateAllFilesFromTrash(userId);
			this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await this.client.AuditLogManager.create({
					eventName: 'FILE_RECOVERED_ALL',
					resourceType: 'FILE',
					resourceId: '',
					success: true,
					userId: filesInTrash[0].userId,
					message: `Successfully empited trash with ${count} files.`,
				});
			});

			return true;
		} catch (err) {
			this.client.logger.error(err);
			this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await this.client.AuditLogManager.create({
					eventName: 'FILE_RECOVERED_ALL',
					resourceType: 'FILE',
					resourceId: '',
					success: false,
					userId: filesInTrash[0].userId,
					message: 'Successfully recovered file.',
				});
			});

			return false;
		}
	}

	/**
	  * Remove the deleted file from the system
	  * @param {string} userId The user ID
	  * @param {string} fileId The file ID
	*/
	async removeFileFromSystem(userId: string, fileId: string) {
		const file = await this.client.FileManager.fetchById(fileId);
		if (file == null) throw 'The specified file does not exist.';
		if (file.userId !== userId) throw 'You do not have permission to restore this file.';
		if (file.deletedAt == null) throw 'File is not in the trash.';

		// Only remove file from system if it's older than current time
		if (file.deletedAt < new Date()) {
			try {
				await this.client.FileManager.deleteFromDB(file.id);
				await this.client.userManager.modifyStorageSize(userId, file.size, 'DECRE');
				const storage = await this.client.FileManager.storageManager.fetchById(file.storageId);
				if (storage !== null) {
					const medium = await this.client.FileManager.storageManager.getProvider(storage);
					medium.deleteFile(`${userId}${file.path}`);
				}

				this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
					await this.client.AuditLogManager.create({
						eventName: 'FILE_DELETE',
						resourceType: 'FILE',
						resourceId: file.id,
						success: true,
						userId: file.userId,
						message: 'Successfully removed file from system.',
					});
				});
			} catch (err) {
				this.client.logger.error(`Failed to remove file from system: ${err}`);
				this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
					await this.client.AuditLogManager.create({
						eventName: 'FILE_DELETE',
						resourceType: 'FILE',
						resourceId: file.id,
						success: false,
						message: `Failed to remove file from system: ${err}.`,
						userId: file.userId,
					});
				});
			}
		}
	}
}