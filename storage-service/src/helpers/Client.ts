import RecentlyViewedFileManager from '../accessors/RecentlyViewedFile';
import NotificationManager from '../accessors/Notification';
import SessionManager from '../accessors/Session';
import FileManager from './FileOperationManager';
import GroupManager from '../accessors/Group';
import UserManager from '../accessors/User';
import Logger from '../utils/Logger';

export default class Client {
	logger: Logger;
	userManager: UserManager;
	groupManager: GroupManager;
	notificationManager: NotificationManager;
	recentlyViewedFileManager: RecentlyViewedFileManager;
	FileManager: FileManager;
	sessionManager: SessionManager;

	constructor() {
		this.logger = new Logger();
		this.userManager = new UserManager();
		this.groupManager = new GroupManager();
		this.notificationManager = new NotificationManager();
		this.recentlyViewedFileManager = new RecentlyViewedFileManager();
		this.FileManager = new FileManager(this);
		this.sessionManager = new SessionManager();
	}
}