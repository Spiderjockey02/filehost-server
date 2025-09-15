import fs from 'fs';
import config from '../../assets/config.json';
import { NestedPaths, NestedValue } from 'src/types';

export class ConfigManager {
	private configPath: string;
	private config: typeof config;

	constructor() {
		this.configPath = `${process.cwd()}/assets/config.json`;

		if (!fs.existsSync(this.configPath)) throw new Error(`Config file not found: ${this.configPath}`);
		this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
	}

	/** Get the full config */
	getAll(): typeof config {
		return this.config;
	}

	/** Get a specific key */
	get<Path extends NestedPaths<typeof config>>(path: Path): NestedValue<typeof config, Path> {
		return path.split('.').reduce((obj: any, key) => obj[key], this.config);
	}

	/** Update a config value */
	set<K extends keyof typeof config>(key: K, value: typeof config[K]): void {
		this.config[key] = value;
		this.save();
	}

	/** Update nested config values safely (dot notation e.g. "THUMBNAIL.WIDTH") */
	setNested(path: string, value: unknown): void {
		const keys = path.split('.');
		let obj: any = this.config;

		for (let i = 0; i < keys.length - 1; i++) {
			if (typeof obj[keys[i]] !== 'object') {
				throw new Error(`Invalid config path: ${path}`);
			}
			obj = obj[keys[i]];
		}

		obj[keys[keys.length - 1]] = value;
		this.save();
	}

	/** Replace the entire config */
	setAll(newConfig: typeof config): void {
		this.config = newConfig;
		this.save();
	}

	/** Save current config to disk */
	private save(): void {
		fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
	}
}