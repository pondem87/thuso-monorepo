import { Config } from 'jest';
require('dotenv').config()

let libs_mapper_root = process.env.LIBS_DEV_ROOT

switch (process.env.NODE_ENV) {
	case "staging":
		libs_mapper_root = process.env.LIBS_STAGING_ROOT
		break;

	default:
		break;
}

const config: Config = {
	"moduleFileExtensions": ["js", "json", "ts"],
	"rootDir": ".",
	"testEnvironment": "node",
	"testRegex": ".e2e-spec.ts$",
	"transform": {
		"^.+\\.(t|j)s$": "ts-jest"
	},
	"moduleNameMapper": {
		"^@lib/(.*)$": libs_mapper_root + "/libs/$1/src"
	}
}

export default config