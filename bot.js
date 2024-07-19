const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const schedule = require("node-schedule");
require("dotenv").config();

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const channelId = process.env.CHANNEL_ID;

let yesterdayResponse = "";
let todayResponse = "";
let completedResponse = "";

client.once("ready", () => {
  console.log("Bot is online!");

  schedule.scheduleJob('*/1 * * * *', () => {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            // Send a message every 2 minutes
            channel.send("**Reminder:** This message is sent every 10 minutes.").catch(console.error);
        }
    });

  // Schedule the first job at 9:15AM
  schedule.scheduleJob(
    { hour: 9, minute: 15, dayOfWeek: new schedule.Range(1, 5) },
    () => {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        // Send "What did I do yesterday?" prompt
        channel
          .send("**What did I do yesterday?**")
          .then(() => {
            const filter = (m) => !m.author.bot && m.content.trim().length > 0;
            channel
              .awaitMessages({ filter, max: 1, time: 15000, errors: ["time"] })
              .then((collectedYesterday) => {
                yesterdayResponse = collectedYesterday.first().content.trim();

                // Send "What will I do today?" prompt
                channel
                  .send("**What will I do today?**")
                  .then(() => {
                    channel
                      .awaitMessages({
                        filter,
                        max: 1,
                        time: 15000,
                        errors: ["time"],
                      })
                      .then((collectedToday) => {
                        todayResponse = collectedToday.first().content.trim();

                        // Send summary message
                        const embed = new EmbedBuilder()
                          .setTitle("Daily Update")
                          .addFields(
                            {
                              name: "What did I do yesterday?",
                              value: yesterdayResponse || "No response",
                            },
                            {
                              name: "What will I do today?",
                              value: todayResponse || "No response",
                            }
                          )
                          .setColor("#FF5733");

                        channel
                          .send({ embeds: [embed] })
                          .then(() => {
                            console.log("Daily update sent successfully.");
                          })
                          .catch(console.error);
                      })
                      .catch(() => {
                        console.log("No response received for today's prompt.");
                      });
                  })
                  .catch(console.error);
              })
              .catch(() => {
                console.log("No response received for yesterday's prompt.");
              });
          })
          .catch(console.error);
      } else {
        console.error(`Channel with ID ${channelId} not found.`);
      }
    }
  );

  // Schedule the second job at 6:30 PM
  schedule.scheduleJob(
    { hour: 18, minute: 30, dayOfWeek: new schedule.Range(1, 5) },
    () => {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        // Send "Task Planned" prompt
        const embed = new EmbedBuilder()
          .setTitle("Task Update")
          .addFields(
            { name: "Task Planned", value: todayResponse || "No response" },
            { name: "What will I do today?", value: "Awaiting response..." }
          )
          .setColor("#FF5733");

        channel
          .send({ embeds: [embed] })
          .then(() => {
            const filter = (m) => !m.author.bot && m.content.trim().length > 0;
            channel
              .awaitMessages({ filter, max: 1, time: 15000, errors: ["time"] })
              .then((collectedTask) => {
                completedResponse = collectedTask.first().content.trim();

                // Update embed with completed task
                const embedCompleted = new EmbedBuilder()
                  .setTitle("Task Update")
                  .addFields(
                    {
                      name: "Task Planned",
                      value: todayResponse || "No response",
                    },
                    {
                      name: "Task Completed",
                      value: completedResponse || "No response",
                    }
                  )
                  .setColor("#FF5733");

                channel
                  .send({ embeds: [embedCompleted] })
                  .then(() => {
                    console.log("Task update sent successfully.");
                  })
                  .catch(console.error);
              })
              .catch(() => {
                console.log("No response received for task completion prompt.");
              });
          })
          .catch(console.error);
      } else {
        console.error(`Channel with ID ${channelId} not found.`);
      }
    }
  );
});

client.login(token);
