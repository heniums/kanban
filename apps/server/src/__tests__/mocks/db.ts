import { vi } from "vitest";

export function mockDbClient() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();
  const mockFor = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockReturnThis();
  const mockReturning = vi.fn().mockReturnThis();

  const mockDb = {
    select: mockSelect,
    insert: vi.fn(() => ({
      values: mockValues,
      returning: mockReturning,
    })),
    transaction: vi.fn((cb) => cb(mockDb)),
  };

  mockSelect.mockReturnValue({
    from: mockFrom,
  });
  mockFrom.mockReturnValue({
    where: mockWhere,
  });
  mockWhere.mockReturnValue({
    for: mockFor,
    then: vi.fn((resolve) => resolve([])),
  });
  mockFor.mockReturnValue({
    then: vi.fn((resolve) => resolve([])),
  });

  return {
    mockDb,
    mockSelect,
    mockFrom,
    mockWhere,
    mockFor,
    mockValues,
    mockReturning,
    mockInsert: mockDb.insert,
    mockTransaction: mockDb.transaction,
  };
}
