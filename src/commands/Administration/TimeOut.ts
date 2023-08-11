import {  ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName('timeout')
	.setDescription('Select a member and timeout them')
	.addUserOption(option => option.setName('target').setDescription("User").setRequired(true))
	.addIntegerOption(option => option.setName('duration').setDescription("duration in minuts").setRequired(false));


export const execute = async (interaction: ChatInputCommandInteraction) => {
	const member = <GuildMember>interaction.options.getMember("target");
	const time = (interaction.options.getInteger("duration") || 5)* 60 * 1000;
	member.timeout(time, "Bruh");
	interaction.reply(`${member.user.displayName} was timeouted for ${interaction.options.getInteger("duration")} minuts`);
};