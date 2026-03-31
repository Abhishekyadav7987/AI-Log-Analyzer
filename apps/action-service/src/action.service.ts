import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPICS } from '@app/common';
import { Client } from 'ssh2';
import { PrismaService } from '@app/database';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  private readonly commandWhitelist = [
    'systemctl restart',
    'df -h',
    'free -m',
    'uptime',
    'ls -la',
    'tail -n',
    'docker restart',
    'nginx -t',
    'nginx -s reload',
    'mysql',
    'echo',
    'sudo',
    'service',
    'psql',
    'sed',
    'pg_ctl',
    'sysctl',
    'vi'
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly kafka: KafkaService,
  ) {}

  async executeFix(ticketId: string) {
    const resolution = await this.prisma.resolution.findUnique({
      where: { ticketId },
    });

    if (!resolution) {
      throw new Error(`No resolution found for ticket ${ticketId}`);
    }

    const commands = resolution.commands as string[];
    const host = this.configService.get<string>('SSH_HOST', 'localhost');
    const results = [];

    let allSucceeded = true;
    for (const cmd of commands) {
      // Stream "Starting command" to Dashboard Terminal
      this.logger.log(`Executing command for ticket ${ticketId}: ${cmd}`);
      await this.kafka.emit(KAFKA_TOPICS.FIX_EXECUTIONS, {
        ticketId,
        command: cmd,
        status: 'STARTING',
        output: `[REMOTESH] Executing: ${cmd}...`
      });

      if (!this.isAllowed(cmd)) {
        const errorMsg = 'Forbidden command blocked by security policy';
        await this.kafka.emit(KAFKA_TOPICS.FIX_EXECUTIONS, {
          ticketId,
          command: cmd,
          status: 'BLOCKED',
          output: `[ERROR] ${errorMsg}`
        });
        results.push({ command: cmd, status: 'BLOCKED', output: errorMsg });
        allSucceeded = false;
        continue;
      }

      try {
        const output = await this.runSSHCommand(cmd);
        
        // Stream "Output" to Dashboard Terminal
        this.logger.log(`Command successful: ${cmd}`);
        await this.kafka.emit(KAFKA_TOPICS.FIX_EXECUTIONS, {
          ticketId,
          command: cmd,
          status: 'SUCCESS',
          output: output || '[SUCCESS] Command finished with no output'
        });

        results.push({ command: cmd, status: 'EXECUTED', output });

        // Log to ExecutionHistory
        await this.prisma.executionHistory.create({
          data: {
            ticketId,
            command: cmd,
            status: 'SUCCESS',
            output,
            executedBy: 'AI-SYSTEM',
            host,
          },
        });
      } catch (error: any) {
        allSucceeded = false;
        this.logger.error(`Command failed: ${cmd} - ${error.message}`);
        await this.kafka.emit(KAFKA_TOPICS.FIX_EXECUTIONS, {
          ticketId,
          command: cmd,
          status: 'FAILED',
          output: `[ERROR] ${error.message}`
        });
        results.push({ command: cmd, status: 'FAILED', output: error.message });
      }
    }

    // Update Ticket Status in DB
    const finalStatus = allSucceeded ? 'RESOLVED' : 'FAILED';
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: finalStatus as any },
    });

    this.logger.log(`Ticket ${ticketId} marked as ${finalStatus}`);

    // Emit final completion event
    await this.kafka.emit(KAFKA_TOPICS.FIX_EXECUTIONS, {
      ticketId,
      status: 'COMPLETED',
      output: `[SYSTEM] Resolution process finished. Ticket status: ${finalStatus}`,
      isFinal: true,
      success: allSucceeded
    });

    return results;
  }

  private isAllowed(command: string): boolean {
    return this.commandWhitelist.some(allowed => command.startsWith(allowed));
  }

  private runSSHCommand(command: string): Promise<string> {
    const host = this.configService.get<string>('SSH_HOST', 'localhost');
    
    // MOCK MODE for Local Demo (if host is localhost, we simulate)
    if (host === 'localhost' || host === '127.0.0.1') {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (command.includes('restart')) resolve(`Stopping service...\nStarting service...\nService restarted successfully.`);
          if (command.includes('df -h')) resolve(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   20G   30G  40% /`);
          resolve(`Command executed successfully on ${host}`);
        }, 1500);
      });
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);
          let data = '';
          stream.on('data', (d: { toString: () => string; }) => data += d.toString());
          stream.on('close', () => {
            conn.end();
            resolve(data);
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host,
        port: this.configService.get<number>('SSH_PORT', 22),
        username: this.configService.get<string>('SSH_USER', 'root'),
        password: this.configService.get<string>('SSH_PASS', 'password'),
      });
    });
  }
}
