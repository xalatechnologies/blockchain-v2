import { getDb, query, queryOne, healthCheck, closeDb } from "@/lib/db/client";

// Mock pg
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("Database Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  afterEach(async () => {
    await closeDb();
  });

  describe("getDb", () => {
    it("should create database pool", () => {
      const db = getDb();
      expect(db).toBeDefined();
    });

    it("should return same instance", () => {
      const db1 = getDb();
      const db2 = getDb();
      expect(db1).toBe(db2);
    });
  });

  describe("query", () => {
    it("should execute query", async () => {
      const mockRows = [{ id: 1, name: "test" }];
      const db = getDb();
      (db.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await query("SELECT * FROM test");
      expect(result).toEqual(mockRows);
    });
  });

  describe("queryOne", () => {
    it("should return first row", async () => {
      const mockRows = [{ id: 1 }];
      const db = getDb();
      (db.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await queryOne("SELECT * FROM test");
      expect(result).toEqual({ id: 1 });
    });

    it("should return null if no rows", async () => {
      const db = getDb();
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await queryOne("SELECT * FROM test");
      expect(result).toBeNull();
    });
  });

  describe("healthCheck", () => {
    it("should return true when healthy", async () => {
      const db = getDb();
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ "?column?": 1 }] });

      const healthy = await healthCheck();
      expect(healthy).toBe(true);
    });

    it("should return false on error", async () => {
      const db = getDb();
      (db.query as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      const healthy = await healthCheck();
      expect(healthy).toBe(false);
    });
  });
});

