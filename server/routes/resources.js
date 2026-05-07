import { updateResourceFavorite, updateResourceProgress, findResourceById, listFavoritesByOwner, listAllResources } from '../db.js';
import { validateFavoritePayload, validateProgressPayload, validateResourceId, validateOwnerId } from '../validators.js';
import { requireAuth } from '../auth.js';

export const router = (app) => {
  // Public listing of seeded resources (no auth)
  app.get('/api/resources/public', (req, res) => {
    try {
      const list = listAllResources();
      res.json({ success: true, resources: list });
    } catch (err) {
      console.error('List public resources error:', err);
      res.status(500).json({ error: 'Failed to list public resources' });
    }
  });
  // Toggle or set favorite for a resource
  app.post('/api/resources/:id/favorite', requireAuth, (req, res) => {
    try {
      // Validate resource ID
      const id = validateResourceId(req.params.id);

      // Validate payload
      const validated = validateFavoritePayload(req.body);
      const { favorite } = validated;

      const existing = findResourceById(id);
      if (!existing) return res.status(404).json({ error: 'Resource not found' });

      // Enforce ownership check: if resource has ownerId, require matching ownerId in request
      if (existing.ownerId && existing.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to modify this resource' });
      }

      updateResourceFavorite(id, !!favorite);
      const updated = findResourceById(id);
      res.json({ success: true, resource: updated });
    } catch (err) {
      console.error('Favorite update error:', err);
      const statusCode = err.message.includes('format') || err.message.includes('required') ? 400 : 500;
      res.status(statusCode).json({ error: err.message || 'Failed to update favorite' });
    }
  });

  // Update progress (0..100) for a resource
  app.post('/api/resources/:id/progress', requireAuth, (req, res) => {
    try {
      const id = validateResourceId(req.params.id);
      const validated = validateProgressPayload(req.body);
      const { progress } = validated;

      const existing = findResourceById(id);
      if (!existing) return res.status(404).json({ error: 'Resource not found' });

      if (existing.ownerId && existing.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to modify this resource' });
      }

      updateResourceProgress(id, progress);
      const updated = findResourceById(id);
      res.json({ success: true, resource: updated });
    } catch (err) {
      console.error('Progress update error:', err);
      const statusCode = err.message?.includes('Progress') || err.message?.includes('number') ? 400 : 500;
      res.status(statusCode).json({ error: err.message || 'Failed to update progress' });
    }
  });

  // List favorites for an owner
  app.get('/api/resources/favorites', requireAuth, (req, res) => {
    try {
      const ownerId = req.query.ownerId || req.user.id;

      // Validate ownerId
      const validatedOwnerId = validateOwnerId(ownerId);
      if (validatedOwnerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to list other user favorites' });
      }
      const list = listFavoritesByOwner(validatedOwnerId);
      res.json({ success: true, resources: list });
    } catch (err) {
      console.error('List favorites error:', err);
      res.status(400).json({ error: err.message || 'Failed to list favorites' });
    }
  });
};
