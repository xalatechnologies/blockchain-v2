import PriceMonitoringBot from './monitoring-bot-lambda.js';

/**
 * AWS Lambda Handler for Price Monitoring
 *
 * Triggered by:
 * - EventBridge (every hour)
 * - Manual API call
 */

export const handler = async (event, context) => {
  console.log('🚀 Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const bot = new PriceMonitoringBot();

    // Single check (Lambda doesn't run continuously)
    const result = await bot.checkPrices();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Price check completed successfully',
        data: result,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Lambda function failed:', error);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Price check failed',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};
