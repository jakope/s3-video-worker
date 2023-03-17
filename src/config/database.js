import { JsonDB, Config } from 'node-json-db';
export const queue = new JsonDB(new Config("queue", true, true, '/'));
export const dones = new JsonDB(new Config("dones", true, true, '/'));
export const errors = new JsonDB(new Config("errors", true, true, '/'));