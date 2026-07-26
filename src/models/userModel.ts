import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  nip: string; // Username/NIP e.g. MK-7892
  password: string; // Hashed or raw password for demo
  activationToken?: string;
  isActivated: boolean;
  googleId?: string;
  avatarUrl?: string;
  assignedZone: string;
  createdAt: string;
  updatedAt: string;
}

const DB_FILE = path.join(process.cwd(), 'users_db.json');

// Pre-seeded initial accounts
const INITIAL_USERS: UserRecord[] = [
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

export class UserModel {
  private static users: UserRecord[] = [];

  public static init(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.users = JSON.parse(raw);
        console.log(`[UserModel] Database loaded successfully (${this.users.length} users).`);
      } else {
        this.users = [...INITIAL_USERS];
        this.save();
        console.log(`[UserModel] Initialized new database with ${this.users.length} default user(s).`);
      }
    } catch (err) {
      console.error('[UserModel] Failed to read database file, resetting to initial state:', err);
      this.users = [...INITIAL_USERS];
    }
  }

  private static save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('[UserModel] Error writing database file:', err);
    }
  }

  public static getAll(): UserRecord[] {
    return this.users;
  }

  public static findByEmail(email: string): UserRecord | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public static findByNip(nip: string): UserRecord | undefined {
    return this.users.find((u) => u.nip.toUpperCase() === nip.toUpperCase());
  }

  public static findByGoogleId(googleId: string): UserRecord | undefined {
    return this.users.find((u) => u.googleId === googleId);
  }

  public static findByActivationToken(token: string): UserRecord | undefined {
    return this.users.find((u) => u.activationToken === token);
  }

  public static findById(id: string): UserRecord | undefined {
    return this.users.find((u) => u.id === id);
  }

  public static create(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): UserRecord {
    const newRecord: UserRecord = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newRecord);
    this.save();
    return newRecord;
  }

  public static update(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.users[index];
  }
}

// Auto-initialize DB model
UserModel.init();
