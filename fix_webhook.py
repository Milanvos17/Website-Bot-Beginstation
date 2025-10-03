with open('server.js', 'r') as f:
    content = f.read()

# Find and replace the webhook section
old_section = """      // Trigger webhook
      try {
        const response = await axios.post(button.webhook_url, {
          buttonId: button.id,
          buttonTitle: button.title,
          triggeredBy: req.session.userEmail,
          timestamp: new Date().toISOString()
        }, {
          timeout: 5000
        });
        
        res.json({ 
          success: true, 
          message: `Webhook triggered successfully for "${button.title}"`,
          webhookResponse: response.status
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError.message);
        res.json({ 
          success: true, 
          message: `Webhook request sent for "${button.title}" (Note: Webhook endpoint may be unavailable)`,
          warning: 'Webhook endpoint did not respond'
        });
      }"""

new_section = """      // Trigger webhook without waiting for response (fire and forget)
      axios.post(button.webhook_url, {
        buttonId: button.id,
        buttonTitle: button.title,
        triggeredBy: req.session.userEmail,
        timestamp: new Date().toISOString()
      }, {
        timeout: 5000
      }).catch(error => {
        // Log error but don't block the response
        console.error('Webhook error:', error.message);
      });
      
      // Immediately respond to user without waiting for webhook
      res.json({ 
        success: true, 
        message: `Button "${button.title}" activated successfully!`
      });"""

content = content.replace(old_section, new_section)

with open('server.js', 'w') as f:
    f.write(content)

print("Webhook section updated successfully!")
