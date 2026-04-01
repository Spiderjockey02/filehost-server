import type { NestedPaths, NestedValue } from '@/types';
import config from '../../assets/config.json';
import { existsSync } from 'fs';
import fs from 'fs/promises';

export class ConfigManager {
	private configPath: string;
	private config: typeof config;

	constructor() {
		this.configPath = `${process.cwd()}/assets/config.json`;
		this.config = {} as typeof config;

		this.load();
	}

	/**
	  * Get the entire config object
	  * @returns {typeof config}
	*/
	getAll(): typeof config {
		return this.config;
	}

	/**
	  * Get a config value by key
	  * @param {Path} path
	  * @returns {NestedValue<typeof config, Path>}
	*/
	get<Path extends NestedPaths<typeof config>>(path: Path): NestedValue<typeof config, Path> {
		return path.split('.').reduce((obj: any, key) => obj[key], this.config);
	}

	/**
	  * Set a config value by key
	  * @param {K} key - The top-level key of the config to set
	  * @param {typeof config[K]} value - The value to set for the specified key
		* @return {Promise<boolean>}
	*/
	set<K extends keyof typeof config>(key: K, value: typeof config[K]): Promise<boolean> {
		this.config[key] = value;
		return this.save();
	}

	/**
	  * Set a nested config value by path
	  * @param {string} path - The dot-separated path to the config value (e.g., "database.host")
	  * @param {unknown} value - The value to set at the specified path
		* @return {Promise<boolean>}
	*/
	setNested(path: string, value: unknown): Promise<boolean> {
		const keys = path.split('.');
		let obj: any = this.config;

		for (let i = 0; i < keys.length - 1; i++) {
			if (typeof obj[keys[i]] !== 'object') {
				throw new Error(`Invalid config path: ${path}`);
			}
			obj = obj[keys[i]];
		}

		obj[keys[keys.length - 1]] = value;
		return this.save();
	}

	/**
	  * Set the entire config object
	  * @param {typeof config} newConfig
		* @return {Promise<boolean>}
	*/
	async setAll(newConfig: typeof config): Promise<boolean> {
		this.config = newConfig;
		return this.save();
	}

	/**
	  * Save the current config to the file
		* @return {Promise<boolean>}
	*/
	private async save(): Promise<boolean> {
		try {
			await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 4));
			return true;
		} catch (err) {
			console.error('Error saving config:', err);
			return false;
		}
	}

	/**
	  * Load the config from the file
	*/
	private async load() {
		try {
			if (!existsSync(this.configPath)) throw new Error(`Config file not found: ${this.configPath}`);
			this.config = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
		} catch (err) {
			console.error('Error loading config:', err);
		}
	}
}