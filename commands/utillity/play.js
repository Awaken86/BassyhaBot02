const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
ytdl.exec = require('ffmpeg-static').path;
//пофиксить ошибку при форматировании, AudioPlayerError: No video id found AudioPlayerError: Not a YouTube domain
module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('plays a sound')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of the sound')
                .setRequired(true)),
    async execute(interaction) {
        // Add audio playback from YouTube
        if (interaction.guild) {
            const url = interaction.options.getString('url', false);
            if (!isValidUrl(url)) {
                return interaction.reply('Invalid URL.');
            }
            function isValidUrl(url) {
                const pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;
                return pattern.test(url);
            }
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return await interaction.reply('You must be in a voice channel to use this function.');
            }
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator
                });
                const stream = ytdl(url, { filter: 'audioonly' });
                const resource = createAudioResource(stream);
                const player = createAudioPlayer();
                player.play(resource);
                connection.subscribe(player);
                player.on('error', (error) => console.error(error));
                player.on(AudioPlayerStatus.Idle, () => {
                    console.log(`song's finished`);
                    connection.disconnect();
                });
                await interaction.reply('Playing...');
            } catch (error) {
                console.error(error);
            }
        }
    },
};