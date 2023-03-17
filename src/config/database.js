import { JsonDB, Config } from 'node-json-db';
//const file = 
import { dirname } from '../../dirname.js';
export const queue = new JsonDB(new Config(dirname + "database/queue.json", true, true, '/'));
export const dones = new JsonDB(new Config(dirname + "database/dones.json", true, true, '/'));
export const errors = new JsonDB(new Config(dirname + "database/errors.json", true, true, '/'));