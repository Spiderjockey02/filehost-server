// For caching files
// For caching database queries
// Add logger here

import { fileItem } from '../types';
import Logger from './Logger';
import UserManager from '../accessors/User';


export default class Client {
	logger: Logger;
	treeCache: Map<string, fileItem>;
	userManager: UserManager;

	constructor() {
		this.logger = new Logger();
		this.treeCache = new Map();
		this.userManager = new UserManager();
	}
}