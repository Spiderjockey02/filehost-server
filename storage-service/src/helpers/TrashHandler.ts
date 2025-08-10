import type { File } from '@prisma/client';
import Client from './Client';
import prismaClient from '../accessors/prisma';
import { UserWithPlan } from 'src/types/database/User';

export default class TrashHandler {
	client: Client;
	constructor(client: Client) {
		this.client = client;
	}

	/**
	  * Move a file to the trash
	  * @param {UserWithPlan} user The user
	  * @param {string} fileId The file path
	*/
	async moveToTrash(user: UserWithPlan, fileId: string) {
		const file = await this.client.FileManager.getById(fileId);
		if (file == null) throw 'Invalid File.';

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
				fileUpdates.push({ id: file.id, deletedAt: null });

				if (file.type === 'DIRECTORY') {
					const children = await this.client.FileManager.getChildrenByParentId(file.id);

					for (const child of children.filter(c => c.deletedAt == null)) {
						await this.moveToTrash(user, child.id);
					}
				}
			});
		} catch (err: any) {
			for (const change of fileUpdates) {
				await this.client.FileManager.update({
					id: change.id,
					deletedAt: change.deletedAt,
				});
			}

			throw new Error(`Failed to move to trash: ${err.message}`);
		}

		return file;
	}

	/**
	 * Restore a deleted file back the user's directory
	 * @param {string} userId The user ID
	 * @param {string} filePath The file path
	 * @returns {File} The updated file
	 */
	async restoreFile(userId: string, filePath: string): Promise<File> {
		const file = await this.client.FileManager.getByFilePath(userId, filePath, true);
		if (file == null) throw new Error('Invalid path');

		// Update the current file/folder in the database
		await this.client.FileManager.update({
			id: file.id,
			deletedAt: null,
		});

		// If it's a folder, process its children (don't move the folder itself again)
		if (file.type === 'DIRECTORY') {
			const children = await this.client.FileManager.getChildrenByParentId(file.id);

			// Move all child files/subfolders (make sure no children are already restored)
			for (const child of children.filter(f => f.deletedAt !== null)) {
				await this.restoreFile(userId, child.path);
			}
		}

		return file;
	}

	/**
	  * Restore a user's entire deleted files back to their files
	  * @param {string} userId The user ID
		* @returns {GetBatchResult} The result of the operation
	*/
	async emptyTrash(userId: string): Promise<File[]> {
		// First get all files in trash so the actual file can be moved back to the user's directory
		const filesInTrash = await this.client.FileManager.fetchOwnedByUserId({ userId, isDeleted: true });
		return Promise.all(filesInTrash.map(async f => await this.restoreFile(userId, f.path)));
	}

	/**
	  * Remove the deleted file from the system
	  * @param {string} userId The user ID
	  * @param {string} filePath The file path
	*/
	async removeFileFromSystem(userId: string, filePath: string) {
		const file = await this.client.FileManager.getByFilePath(userId, filePath, true);
		if (file && file.deletedAt !== null) {
			await this.client.FileManager.deleteFromDB(file.id);
			await this.client.userManager.modifyStorageSize(userId, file.size, 'DECRE');
			const storage = await this.client.FileManager.storageManager.fetchById(file.storageId);
			if (storage !== null) {
				const medium = await this.client.FileManager.storageManager.getProvider(storage);
				medium.deleteFile(`${userId}${filePath}`);
			}

		}
	}
}