import RecentlyViewedFileManager from '../accessors/RecentlyViewedFile';
import NotificationManager from '../accessors/Notification';
import SessionManager from '../accessors/Session';
import FileManager from './FileOperationManager';
import UserManager from '../accessors/User';
import Logger from '../utils/Logger';
import CRONManager from './CRONManager';
import QueueManager from './QueueManager';
import StorageManager from './StorageManager';
import UserActivityManager from './UserActivityManager';
import { Server } from 'socket.io';
import { ConfigManager } from './ConfigManager';
import AuditLogAccessor from '../accessors/AuditLog';

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
		this.AuditLogManager = new AuditLogAccessor();
	}
}