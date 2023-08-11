import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };
import path from "path";
import fs from "fs";
import { Command } from "./Types/Command.js";

const foldersPath = path.join("./out/commands");
const commandFolders = fs.readdirSync(foldersPath);
const commands: unknown[] = [];

class Bot {
    public readonly client = new Client({ intents: [GatewayIntentBits.Guilds] });
    private commands = new Map<string, Command>();

    private isLoginned = false;

    private async InitCommands() {

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = await import("../"+filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    this.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        const rest = new REST().setToken(config.token);

        (async () => {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                await rest.put(
                    Routes.applicationGuildCommands(config.clientId, config.guildId),
                    { body: commands },
                );

            } catch (error) {
                console.error(error);
            }
        })();
        
    }

    private InitEvents() {
        this.client.once("ready",() => {
            console.log(`${this.client.user?.tag} is ready`)
        });

        this.client.on("interactionCreate", async interaction => {
            if (!interaction.isChatInputCommand()) return;
            
            const command = this.commands.get(interaction.commandName) as Command;
            if (!command) return;
        
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        });

    }

    public async Init() {
        if (this.isLoginned) return;
        this.isLoginned = true;
        console.clear();

        await this.InitCommands();
        this.InitEvents();

        
        this.client.login(config.token);
        return this;
    }
}

export default await new Bot().Init();
