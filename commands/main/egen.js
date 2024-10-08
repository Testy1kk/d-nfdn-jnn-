const fs = require('fs').promises;
const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

const egenChannel = config.egenChannel; // Ensure this ID is in config.json
const extremechannelId = config.extremechannelId; // Ensure this ID is in config.json
const providerRoleId = config.providerRoleId; // Ensure this ID is in config.json
const cooldowns = new Map();

module.exports = {
    name: 'egen',
    description: 'Generate a specified service if stocked (extreme)',
    usage: 'egen <service>',

    async execute(message, args) {
        if (message.channel.id !== egenChannel) {
            return message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Wrong command usage!')
                    .setDescription(`You cannot use the \`egen\` command in this channel! Try it in <#${egenChannel}>!`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        }

        const service = args[0];
        if (!service) {
            return message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Missing parameters!')
                    .setDescription('You need to provide a service name!')
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        }

        // Determine cooldown based on user role
        const userRole = message.member.roles.cache.find(role => role.id === '1213414633633751050' || role.id === '1200663200329371666');
        const cooldownTime = userRole ? (userRole.id === '1213414633633751050' ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000) : 24 * 60 * 60 * 1000;
        const cooldownKey = `${message.author.id}-egen`;

        if (cooldowns.has(cooldownKey)) {
            const remainingCooldown = cooldowns.get(cooldownKey) - Date.now();
            if (remainingCooldown > 0) {
                const hours = Math.floor(remainingCooldown / (60 * 60 * 1000));
                const minutes = Math.floor((remainingCooldown % (60 * 60 * 1000)) / (60 * 1000));

                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Cooldown!')
                        .setDescription(`You are on cooldown! Please wait ${hours} hours and ${minutes} minutes before using the command again.`)
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            } else {
                cooldowns.delete(cooldownKey);
            }
        }

        cooldowns.set(cooldownKey, Date.now() + cooldownTime);
        setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime);

        const filePath = `${__dirname}/../../extreme/${service}.txt`;

        try {
            const data = await fs.readFile(filePath, 'utf8');
            const position = data.indexOf('\n');
            const firstLine = data.split('\n')[0];

            if (position === -1) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Generator error!')
                        .setDescription(`I do not find the \`${service}\` service in my extreme stock!`)
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            }

            const generatedCode = firstLine;
            const formattedTime = new Date().toLocaleString();

            const redemptionEmbed = new MessageEmbed()
                .setColor(config.color.green)
                .setTitle(`${service} Account Generated`)
                .setDescription(`You have generated a \`${service}\` account.\nPlease wait till the BOT sends your account, this may take time so wait calmly.`)
                .setFooter(`Generated by BLUE G3N • ${formattedTime}`);

            await message.author.send(redemptionEmbed);

            await fs.appendFile(`${__dirname}/../../extremegive/extremegive.txt`, `${message.author.username} - ${service}\n`);

            if (extremechannelId && providerRoleId) {
                const extremechannel = message.client.channels.cache.get(extremechannelId);
                if (extremechannel) {
                    const providerRole = extremechannel.guild.roles.cache.get(providerRoleId);
                    if (providerRole) {
                        await extremechannel.send(
                            `<@&${providerRoleId}>`,
                            new MessageEmbed()
                                .setColor(config.color.blue)
                                .setTitle('New Account Request')
                                .setDescription(`User ${message.author} has requested an account. Please provide the account details to them as soon as possible.`)
                                .addField('Account', `\`\`\`${service}\`\`\``)
                                .setFooter(formattedTime)
                        );
                    }
                }
            }

            await fs.writeFile(filePath, data.substr(position + 1));

            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Account generated successfully!')
                    .setDescription(`Check your private messages, ${message.author}! If you do not receive the message, please unlock your private messages.`)
                    .setImage(config.gif)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        } catch (error) {
            console.error(error);
            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`Service \`${service}\` does not exist or an error occurred!`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        }
    },
};