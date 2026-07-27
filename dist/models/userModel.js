"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_FILE = path_1.default.join(process.cwd(), 'users_db.json');
// Pre-seeded initial accounts
const INITIAL_USERS = [
    {
        id: 'user-default-01',
        fullName: 'Rudi Kurir',
        phone: '081234567890',
        email: 'rudi.kurir@marscargo.com',
        gender: 'Laki-laki',
        nip: 'MK-9042',
        password: '••••••••',
        isActivated: true,
        assignedZone: 'Jakarta Pusat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
class UserModel {
    static users = [];
    static init() {
        try {
            if (fs_1.default.existsSync(DB_FILE)) {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                this.users = JSON.parse(raw);
                console.log(`[UserModel] Database loaded successfully (${this.users.length} users).`);
            }
            else {
                this.users = [...INITIAL_USERS];
                this.save();
                console.log(`[UserModel] Initialized new database with ${this.users.length} default user(s).`);
            }
        }
        catch (err) {
            console.error('[UserModel] Failed to read database file, resetting to initial state:', err);
            this.users = [...INITIAL_USERS];
        }
    }
    static save() {
        try {
            fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[UserModel] Error writing database file:', err);
        }
    }
    static getAll() {
        return this.users;
    }
    static findByEmail(email) {
        return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    static findByNip(nip) {
        return this.users.find((u) => u.nip.toUpperCase() === nip.toUpperCase());
    }
    static findByGoogleId(googleId) {
        return this.users.find((u) => u.googleId === googleId);
    }
    static findByActivationToken(token) {
        return this.users.find((u) => u.activationToken === token);
    }
    static findById(id) {
        return this.users.find((u) => u.id === id);
    }
    static create(user) {
        const newRecord = {
            ...user,
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.users.push(newRecord);
        this.save();
        return newRecord;
    }
    static update(id, updates) {
        const index = this.users.findIndex((u) => u.id === id);
        if (index === -1)
            return undefined;
        this.users[index] = {
            ...this.users[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.save();
        return this.users[index];
    }
}
exports.UserModel = UserModel;
// Auto-initialize DB model
UserModel.init();
