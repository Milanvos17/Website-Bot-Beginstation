# Multi-Bot System Implementation Guide

## 🤖 Overview

The Beginstation Robot Control application now supports **multiple bots** with individual webhook configurations for each button. This allows you to manage different bots, each with their own webhook URLs, and trigger them individually or all at once.

---

## ✨ New Features

### 1. **Bot Management**
- **Default Bot**: "Bot 1" is created automatically
- **Create New Bots**: Admins and Owners can create additional bots (Bot 2, Bot 3, etc.)
- **Bot Selector**: Dropdown menu at the top of the dashboard to switch between bots
- **ALL Option**: Special option to trigger all bots simultaneously

### 2. **Bot-Specific Webhooks**
- Each button can have a **different webhook URL for each bot**
- Webhooks are stored separately for each bot-button combination
- Easy webhook management through the dashboard interface

### 3. **Visual Indicators**
- **Animated "!!!"**: Shows when a webhook is not configured for the selected bot
- **✓ Configured**: Green checkmark when webhook is set up
- **Webhook Count**: Shows how many bots have webhooks configured (in ALL view)
- **Color-coded badges**: Different colors for different states

### 4. **Webhook Management Interface**
- **Edit/Add Webhook Button**: Click to open modal for webhook configuration
- **Modal Dialog**: Clean interface for entering webhook URLs
- **Real-time Updates**: Changes reflect immediately after saving

---

## 🗄️ Database Schema

### New Tables:

#### **bots** Table
```sql
CREATE TABLE bots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
)
```

#### **bot_webhooks** Table
```sql
CREATE TABLE bot_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id INTEGER NOT NULL,
  button_id INTEGER NOT NULL,
  webhook_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE,
  UNIQUE(bot_id, button_id)
)
```

---

## 🎯 How It Works

### Bot Selection

1. **Dropdown Menu**: Located at the top left of the dashboard
2. **Options**:
   - **ALL**: Trigger all bots when clicking a button
   - **Bot 1, Bot 2, Bot 3...**: Individual bot selection

### Single Bot View (e.g., "Bot 1" selected)

When you select a specific bot:
- Dashboard shows all buttons
- Each button displays its webhook status for the selected bot
- **"!!!"** indicator if webhook is not configured
- **"✓ Configured"** if webhook is set up
- **Edit/Add Webhook** button to manage the webhook URL

### ALL View

When "ALL" is selected:
- Dashboard shows all buttons
- Each button displays webhook count across all bots
- **"!!!"** if no webhooks are configured
- **"X/Y bots"** badge showing how many bots have webhooks (e.g., "2/3 bots")
- **"✓ All bots ready"** if all bots have webhooks configured
- Clicking a button triggers **all configured webhooks**

---

## 📝 User Guide

### For Admins/Owners:

#### Creating a New Bot

1. Go to the dashboard
2. Look for the bot selector at the top
3. Click **"+ Create New Bot"** button
4. A new bot (e.g., "Bot 2") will be created automatically
5. The page will refresh to show the new bot

#### Configuring Webhooks

**Method 1: Single Bot Configuration**
1. Select a specific bot from the dropdown (e.g., "Bot 1")
2. Find the button you want to configure
3. Click **"Add Webhook"** or **"Edit Webhook"** button
4. Enter the webhook URL in the modal
5. Click **"Save Webhook"**
6. The webhook is now configured for that bot

**Method 2: Configure Multiple Bots**
1. Select "Bot 1" and configure webhooks for all buttons
2. Switch to "Bot 2" and configure webhooks for the same buttons
3. Repeat for all bots
4. Switch to "ALL" view to see the overall status

#### Adding New Buttons

1. Click **"Add New Button"** (top right)
2. Fill in button details (title, category, webhook URL, visibility)
3. The button is created with the default webhook URL
4. You can then configure bot-specific webhooks for this button

### For Users:

#### Triggering Buttons

**Single Bot Mode:**
1. Select a bot from the dropdown
2. Click any button to trigger that bot's webhook
3. Only the selected bot will be activated

**ALL Mode:**
1. Select "ALL" from the dropdown
2. Click any button to trigger all bots
3. All bots with configured webhooks will be activated simultaneously

---

## 🔧 Technical Details

### Webhook Payload

When a button is triggered, the webhook receives:

**Single Bot:**
```json
{
  "buttonId": 1,
  "buttonTitle": "Start Motor",
  "triggeredBy": "user@example.com",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "botName": "Bot 1",
  "botId": 1
}
```

**ALL Mode (sent to each bot):**
```json
{
  "buttonId": 1,
  "buttonTitle": "Start Motor",
  "triggeredBy": "user@example.com",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "botName": "Bot 1",  // Different for each bot
  "botId": 1           // Different for each bot
}
```

### API Endpoints

#### Create New Bot
```
POST /create-bot
Response: { success: true, message: "Bot 2 created successfully!" }
```

#### Update Bot Webhook
```
POST /update-bot-webhook
Body: {
  botId: 1,
  buttonId: 1,
  webhookUrl: "https://example.com/webhook"
}
Response: { success: true, message: "Webhook updated successfully!" }
```

#### Trigger Webhook
```
POST /trigger-webhook/:buttonId
Body: {
  botId: "1" or "all"
}
Response: { 
  success: true, 
  message: "Button activated for Bot 1!" 
}
```

---

## 🎨 Visual Indicators

### Webhook Status Indicators

| Indicator | Meaning | Color |
|-----------|---------|-------|
| **!!!** (animated) | Webhook not configured | Red, pulsing |
| **✓ Configured** | Webhook is set up | Green |
| **X/Y bots** | X out of Y bots have webhooks | Orange badge |
| **✓ All bots ready** | All bots configured | Green |

### Button States

- **No Webhook**: Red "!!!" with animation
- **Partial Configuration**: Orange badge showing count
- **Fully Configured**: Green checkmark

---

## 📋 Workflow Examples

### Example 1: Setting Up 3 Bots for a Button

1. **Create Bots**:
   - Bot 1 (already exists)
   - Click "Create New Bot" → Bot 2 created
   - Click "Create New Bot" → Bot 3 created

2. **Configure Bot 1**:
   - Select "Bot 1" from dropdown
   - Click "Add Webhook" on "Start Motor" button
   - Enter: `https://bot1.example.com/webhook`
   - Save

3. **Configure Bot 2**:
   - Select "Bot 2" from dropdown
   - Click "Add Webhook" on "Start Motor" button
   - Enter: `https://bot2.example.com/webhook`
   - Save

4. **Configure Bot 3**:
   - Select "Bot 3" from dropdown
   - Click "Add Webhook" on "Start Motor" button
   - Enter: `https://bot3.example.com/webhook`
   - Save

5. **Test ALL Mode**:
   - Select "ALL" from dropdown
   - Click "Start Motor" button
   - All 3 webhooks are triggered simultaneously

### Example 2: Different Webhooks for Different Bots

**Scenario**: You have a "Turn On Lights" button that should:
- Bot 1: Control living room lights
- Bot 2: Control bedroom lights
- Bot 3: Control kitchen lights

**Setup**:
1. Select "Bot 1" → Configure webhook: `https://api.lights.com/living-room`
2. Select "Bot 2" → Configure webhook: `https://api.lights.com/bedroom`
3. Select "Bot 3" → Configure webhook: `https://api.lights.com/kitchen`

**Usage**:
- Select "Bot 1" → Click button → Only living room lights turn on
- Select "Bot 2" → Click button → Only bedroom lights turn on
- Select "ALL" → Click button → All lights turn on

---

## 🚀 Benefits

### 1. **Flexibility**
- Different bots can have different webhook endpoints
- Easy to manage multiple robot systems
- Individual or batch control

### 2. **Scalability**
- Add unlimited bots
- Each bot operates independently
- No interference between bots

### 3. **User-Friendly**
- Clear visual indicators
- Easy webhook management
- Intuitive interface

### 4. **Safety**
- Test individual bots before using ALL mode
- Clear indication of configuration status
- Prevents accidental triggers

---

## 🔍 Troubleshooting

### Issue: "!!!" indicator showing

**Solution**: 
- Click "Add Webhook" button
- Enter the webhook URL for that bot
- Save the configuration

### Issue: Button not triggering in ALL mode

**Possible Causes**:
1. No webhooks configured for any bot
2. All webhook URLs are empty

**Solution**:
- Switch to individual bot view
- Configure webhooks for each bot
- Return to ALL mode and try again

### Issue: Only some bots triggering in ALL mode

**Explanation**: This is normal behavior
- ALL mode only triggers bots with configured webhooks
- Bots without webhooks are skipped

**Solution**: Configure webhooks for remaining bots

---

## 📊 Database Operations

### Get All Bots
```javascript
const bots = botOperations.getAll();
```

### Create New Bot
```javascript
botOperations.create('Bot 2', userId);
```

### Get Bot Webhook
```javascript
const webhook = botWebhookOperations.getByBotAndButton(botId, buttonId);
```

### Update Bot Webhook
```javascript
botWebhookOperations.create(botId, buttonId, webhookUrl);
```

### Get All Webhooks for Button
```javascript
const webhooks = botWebhookOperations.getAllWebhooksForButton(buttonId);
```

---

## 🎯 Best Practices

### 1. **Naming Convention**
- Keep bot names simple: "Bot 1", "Bot 2", etc.
- Use descriptive webhook URLs
- Document which bot controls what

### 2. **Testing**
- Always test individual bots first
- Verify webhooks are working before using ALL mode
- Use webhook testing tools (e.g., webhook.site)

### 3. **Organization**
- Configure webhooks systematically
- Complete one bot before moving to the next
- Use the ALL view to verify overall status

### 4. **Maintenance**
- Regularly check webhook status
- Update URLs when endpoints change
- Remove unused bots to keep interface clean

---

## 🔮 Future Enhancements

Potential improvements for the multi-bot system:

1. **Bot Renaming**: Allow custom bot names
2. **Bot Deletion**: Remove unused bots
3. **Bulk Configuration**: Set same webhook for all bots
4. **Bot Groups**: Organize bots into groups
5. **Webhook Testing**: Test webhooks before saving
6. **Activity Logs**: Track which bots were triggered
7. **Bot Status**: Show online/offline status
8. **Webhook History**: View past webhook calls
9. **Bot Permissions**: Different users control different bots
10. **Import/Export**: Backup and restore bot configurations

---

## ✅ Summary

The multi-bot system provides:
- ✅ Unlimited bot creation
- ✅ Individual webhook configuration per bot
- ✅ ALL mode for simultaneous triggering
- ✅ Clear visual indicators
- ✅ Easy webhook management
- ✅ Flexible and scalable architecture

**Your robot control system is now ready for multi-bot operations!** 🤖🚀