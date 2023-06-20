const { exec } = require('child_process');
const { spawn } = require('child_process');
const commands = require('./adminCommandList.js');
const queryTypes = require('../util/queryTypes.js');

const admins = process.env.ADMIN_GROUP.split(',');

function isAdmin(ctx) {
  const userId = ctx.message.from.id.toString();
  return admins.includes(userId);
}

async function adminCommand(bot) {
  for (const [commandName, commandDetails] of Object.entries(commands)) {
    bot.command(commandName, async (ctx) => {
      spamCheck = await queryTypes.spamCheck()
      telegram_id = ctx.message.from.id
    
      permission = await spamCheck
        .getData(commandName, telegram_id)
        .then(async ({ permission }) => {
          return permission
        })
        .catch(error => console.log(`Error : ${error}`))
    
      if (permission != `allow`) {
        await ctx.deleteMessage()
        return
      }
      if (isAdmin(ctx)) {
        if (commandName === 'othubbotrestart' || commandName === 'othubbotstop') {
          const botmessage = await ctx.reply(`Command ${commandName} is being executed.`);
          if (botmessage) {
            setTimeout(async () => {
              try {
                await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
              } catch (error) {
                console.error('Error deleting message:', error)
              }
            }, process.env.DELETE_TIMER)
          }
        }
        
        const parts = commandDetails.action.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        const childProcess = spawn(cmd, args);

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
          stdout += data;
        });

        childProcess.stderr.on('data', (data) => {
          stderr += data;
        });

        childProcess.on('close', (code) => {
          if (code !== 0) {
            // If the command is othubbotrestart or othubbotstop and the exit code is null, ignore the error
            if ((commandName === 'othubbotrestart' || commandName === 'othubbotstop') && code === null) {
              return;
            }
            ctx.reply(`Command failed with exit code ${code}: ${stderr}`);
            return;
          }
          // Don't send success message for restart or stop commands as they might have killed the process already
          if (commandName !== 'othubbotrestart' && commandName !== 'othubbotstop') {
            ctx.reply(`Command execution successful: ${stdout}`);
          }
        });

        childProcess.on('error', (error) => {
          ctx.reply(`Command failed with error: ${error.message}`);
        });

        await ctx.deleteMessage()
        
      } else {
        const botmessage = await ctx.reply('You are not authorized to execute this command.');
        if (botmessage) {
          setTimeout(async () => {
            try {
              await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
            } catch (error) {
              console.error('Error deleting message:', error)
            }
          }, process.env.DELETE_TIMER)
        }
      }
    });
  }
}

module.exports = {
  adminCommand,
  isAdmin,
};
