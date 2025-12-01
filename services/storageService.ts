/**
 * Servicio de almacenamiento local.
 * Diseñado para ser reemplazado fácilmente por una API real en el futuro.
 */

export const StorageService = {
  /**
   * Obtiene una colección de items dada una clave (nombre de la herramienta o tabla)
   */
  getAll: <T>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(`Error reading ${key} from storage`, error);
      return [];
    }
  },

  /**
   * Guarda un nuevo item en una colección
   */
  add: <T extends { id: string }>(key: string, item: T): T[] => {
    try {
      const current = StorageService.getAll<T>(key);
      const updated = [item, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error(`Error adding item to ${key}`, error);
      return [];
    }
  },

  /**
   * Elimina un item por ID
   */
  remove: <T extends { id: string }>(key: string, id: string): T[] => {
    try {
      const current = StorageService.getAll<T>(key);
      const updated = current.filter((item) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error(`Error removing item from ${key}`, error);
      return [];
    }
  },

  /**
   * Limpia toda una colección
   */
  clear: (key: string): void => {
    localStorage.removeItem(key);
  }
};