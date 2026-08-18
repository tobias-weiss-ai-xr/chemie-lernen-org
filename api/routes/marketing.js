/**
 * Marketing API Routes for chemie-lernen.org
 */

import express from 'express';
import { generateBlogFromEntity } from '../services/marketing/blog-generator.js';
import { generateMetaTags } from '../services/marketing/seo-generator.js';
import { getAnalyticsData } from '../services/marketing/analytics-service.js';
import { generateSocialPost } from '../services/marketing/social-generator.js';
import { generateNewsletter } from '../services/marketing/newsletter-generator.js';

const router = express.Router();

/**
 * Generate blog post from Knowledge Graph entity
 * GET /api/marketing/generate-blog/:entityName
 * Query: ?format=hugo-markdown|wordpress|json
 */
router.get('/generate-blog/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;
    const { format = 'hugo-markdown' } = req.query;

    const blogPost = await generateBlogFromEntity(entityName, format);

    res.json({
      success: true,
      format,
      entityName,
      blogPost
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate meta tags for entity page
 * GET /api/marketing/meta/:entityName
 */
router.get('/meta/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;

    const metaTags = await generateMetaTags(entityName);

    res.json({
      success: true,
      entityName,
      metaTags
    });
  } catch (error) {
    console.error('Meta generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate Schema.org JSON-LD for entity page
 * GET /api/marketing/schema/:entityName
 * Query: ?type=Article|Video|Quiz|LearningResource
 */
router.get('/schema/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;
    const { type = 'LearningResource' } = req.query;

    const schemaMarkup = await generateMetaTags(entityName, type);

    res.json({
      success: true,
      entityName,
      type,
      schemaMarkup
    });
  } catch (error) {
    console.error('Schema generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate social media post
 * GET /api/marketing/generate-social/:entityName
 * Query: ?platform=twitter|linkedin|instagram&tone=educational|engaging|promotional
 */
router.get('/generate-social/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;
    const { platform = 'twitter', tone = 'educational' } = req.query;

    const socialPost = await generateSocialPost(entityName, platform, tone);

    res.json({
      success: true,
      entityName,
      platform,
      tone,
      socialPost
    });
  } catch (error) {
    console.error('Social post generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate newsletter (weekly digest or monthly deep-dive)
 * GET /api/marketing/newsletter
 * Query: ?type=weekly|monthly&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
router.get('/newsletter', async (req, res) => {
  try {
    const { type = 'weekly', start_date, end_date } = req.query;

    const newsletter = await generateNewsletter(type, start_date, end_date);

    res.json({
      success: true,
      type,
      newsletter
    });
  } catch (error) {
    console.error('Newsletter generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get analytics data from GA4
 * GET /api/marketing/analytics
 * Query: ?period=last_7_days|last_30_days|last_quarter
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'last_7_days' } = req.query;

    const analytics = await getAnalyticsData(period);

    res.json({
      success: true,
      period,
      analytics
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Track conversion event
 * POST /api/marketing/track-conversion
 * Body: { event, entity, session_id, user_id, timestamp }
 */
router.post('/track-conversion', async (req, res) => {
  try {
    const { event, entity, session_id, user_id, timestamp } = req.body;

    // Implement GA4 event tracking via Measurement Protocol
    console.log('Tracking conversion:', { event, entity, session_id, user_id, timestamp });

    res.json({
      success: true,
      message: 'Conversion event tracked'
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Collect user feedback
 * POST /api/marketing/collect-feedback
 * Body: { type, entity, rating, feedback_text, user_email }
 */
router.post('/collect-feedback', async (req, res) => {
  try {
    const { type, entity, rating, feedback_text, user_email } = req.body;

    // Store feedback in database or send to Airtable/Notion
    console.log('Feedback collected:', { type, entity, rating, feedback_text, user_email });

    res.json({
      success: true,
      message: 'Feedback collected successfully'
    });
  } catch (error) {
    console.error('Feedback collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
