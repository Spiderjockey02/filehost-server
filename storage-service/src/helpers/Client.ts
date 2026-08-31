import { UserManager, NotificationManager, RecentlyViewedFileManager, SessionManager, AuditLogAccessor, PlanAccessor } from '@/accessors';
import FileManager from '@/helpers/SystemManagers/FileOperationManager';
import type { AuditLogListener } from '@/types/generated/client';
import type { FullAuditLog } from '@/types/database/AuditLogs';
import StorageManager from './SystemManagers/StorageManager';
import { ConfigManager } from '../services/ConfigManager';
import UserActivityManager from './UserActivityManager';
import QueueManager from '../services/QueueManager';
import CRONManager from '../services/CRONManager';
import { parseUserAgent, Logger } from '@/utils';
import type { Server } from 'socket.io';

export default class Client {
	logger: Logger;
	userManager: UserManager;
	notificationManager: NotificationManager;
	recentlyViewedFileManager: RecentlyViewedFileManager;
	FileManager: FileManager;
	sessionManager: SessionManager;
	CRONManager: CRONManager;
	QueueManager: QueueManager;
	userActivityManager: UserActivityManager;
	config: ConfigManager;
	AuditLogManager: AuditLogAccessor;
	PlanManager: PlanAccessor;
	socket: Server;

	constructor(io: Server) {
		this.config = new ConfigManager();
		this.logger = new Logger();
		this.userManager = new UserManager();
		this.notificationManager = new NotificationManager(io);
		this.recentlyViewedFileManager = new RecentlyViewedFileManager();
		this.FileManager = new FileManager(this, new StorageManager(this));
		this.sessionManager = new SessionManager();
		this.CRONManager = new CRONManager(this);
		this.QueueManager = new QueueManager();
		this.userActivityManager = new UserActivityManager();
		this.AuditLogManager = new AuditLogAccessor(this);
		this.PlanManager = new PlanAccessor();
		this.socket = io;
	}

	async sendWebhook(listener: AuditLogListener, log: FullAuditLog) {
		let userAgent = '';

		if (log.userAgent) {
			const parsedUserAgent = parseUserAgent(log.userAgent);
			userAgent = `${parsedUserAgent.browserName} ${parsedUserAgent.browserVersion} on ${parsedUserAgent.osName} ${parsedUserAgent.osVersion}`;
		}

		const params = {
			embeds: [{
				title: `${log.event.displayName}`,
				description: log.message || 'No message provided.',
				fields: [
					{
						name: '👤 User',
						value: log.user !== null ? log.userId : 'Unknown',
						inline: true,
					},
					{
						name: '🕒 Timestamp',
						value: new Date(log.createdAt).toLocaleString('en-GB', {
							dateStyle: 'medium',
							timeStyle: 'short',
						}),
						inline: true,
					},
					{
						name: '✅ Success',
						value: log.success ? 'Yes' : 'No',
						inline: true,
					},
					...(log.ipAddress ? [
						{
							name: '🌍 IP Address',
							value: log.ipAddress,
							inline: true,
						},
					]	: []),
					...(log.userAgent ? [
						{
							name: '💻 User Agent',
							value: userAgent,
							inline: true,
						},
					]	: []),
					...(log.message ? [
						{
							name: '📋 Details',
							value: log.message.slice(0, 1000),
							inline: false,
						},
					] : []),
				],
				footer: {
					text: `Audit Log ID: ${log.id}`,
				},
			}],
		};

		// Send webhook
		if (!listener.targetUrl) return;
		await fetch(listener.targetUrl, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(params),
		});
	}

	async sendNotification(client: Client, listener: AuditLogListener, log: FullAuditLog) {
		let userAgent = '';

		if (log.userAgent) {
			const parsedUserAgent = parseUserAgent(log.userAgent);
			userAgent = `${parsedUserAgent.browserName} ${parsedUserAgent.browserVersion} on ${parsedUserAgent.osName} ${parsedUserAgent.osVersion}`;
		}

		client.notificationManager.create({
			text: `${log.message} ${userAgent} ${log.ipAddress || ''}`,
			title: `Audit Log: ${log.event.displayName}`,
			userId: listener.adminId,
			url: `/admin/logs/${log.id}`,
		});
	}
}