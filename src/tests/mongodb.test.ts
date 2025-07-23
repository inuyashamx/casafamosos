import dbConnect from '../lib/mongodb';

describe('MongoDB Connection', () => {
  it('debería conectar exitosamente a la base de datos', async () => {
    await expect(dbConnect()).resolves.not.toThrow();
  });
}); 