import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateSessionDto } from './dto/createSession.dto';
import { RegisterAgentDto } from './dto/register-agent';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';


@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  // ── REGISTRO DE ASESOR (recibe multipart/form-data) ─────────────────────
  @Post('register-asesor')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document', maxCount: 1 },
        { name: 'diploma', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            const dir = './uploads/agent-docs';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
          },
          filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}-${file.originalname}`);
          },
        }),
      },
    ),
  )
  async registerAgent(
    @Body() dto: RegisterAgentDto,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      diploma?: Express.Multer.File[];
    },
  ) {
    if (files?.document?.[0]) {
      dto.documentUrl = `/uploads/agent-docs/${files.document[0].filename}`;
    }
    if (files?.diploma?.[0]) {
      dto.diplomaUrl = `/uploads/agent-docs/${files.diploma[0].filename}`;
    }
    return this.agentService.registerAgent(dto);
  }

  @Post('requests')
  createRequest(
    @Body()
    body: { topic: string; message: string; userId: string; agentId: string },
  ) {
    return this.agentService.createRequest(body);
  }

  @Patch('requests/:requestUuid/accept')
  acceptRequest(@Param('requestUuid') requestUuid: string) {
    return this.agentService.acceptRequest(requestUuid);
  }

  @Patch('requests/:requestUuid/reject')
  rejectRequest(@Param('requestUuid') requestUuid: string) {
    return this.agentService.rejectRequest(requestUuid);
  }

  @Post('sessions')
  createSession(@Body() dto: CreateSessionDto) {
    return this.agentService.createSession(dto);
  }

  @Patch('sessions/:sessionUuid/cancel')
  cancelSession(@Param('sessionUuid') sessionUuid: string) {
    return this.agentService.cancelSession(sessionUuid);
  }

  @Patch('sessions/:sessionUuid/complete')
  completeSession(@Param('sessionUuid') sessionUuid: string) {
    return this.agentService.completeSession(sessionUuid);
  }

  @Patch('sessions/:sessionUuid/accept')
  acceptSession(@Param('sessionUuid') sessionUuid: string) {
    return this.agentService.acceptSession(sessionUuid);
  }

  @Patch('sessions/:sessionUuid/reject')
  rejectSession(@Param('sessionUuid') sessionUuid: string) {
    return this.agentService.rejectSession(sessionUuid);
  }

  @Post('reviews')
  createReview(
    @Body()
    body: { agentId: string; userId: string; rating: number; comment: string },
  ) {
    return this.agentService.createReview(body);
  }

  @Get(':userUuid/requests')
  getRequests(@Param('userUuid') userUuid: string) {
    return this.agentService.getAgentRequests(userUuid);
  }

  @Get(':userUuid/clients')
  getClients(@Param('userUuid') userUuid: string) {
    return this.agentService.getAgentClients(userUuid);
  }

  @Get(':userUuid/sessions')
  getSessions(@Param('userUuid') userUuid: string) {
    return this.agentService.getAgentSessions(userUuid);
  }

  // ───────── CASE DOCUMENTS ─────────
  @Post(':userUuid/case-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = './uploads/case-documents';
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
      }),
    }),
  )
  uploadCaseDocument(
    @Param('userUuid') userUuid: string,
    @Body('agentUserUuid') agentUserUuid: string,
    @Body('note') note: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.agentService.uploadCaseDocument(agentUserUuid, userUuid, file, note);
  }

  @Get(':userUuid/case-data')
  getCaseData(
    @Param('userUuid') userUuid: string,
    @Query('agentUserUuid') agentUserUuid: string,
  ) {
    return this.agentService.getCaseData(agentUserUuid, userUuid);
  }

  @Patch(':userUuid/case-document/:documentUuid')
  updateCaseDocument(
    @Param('userUuid') userUuid: string,
    @Param('documentUuid') documentUuid: string,
    @Body('agentUserUuid') agentUserUuid: string,
    @Body('note') note: string,
  ) {
    return this.agentService.updateCaseDocument(agentUserUuid, userUuid, documentUuid, note);
  }

  @Delete(':userUuid/case-document/:documentUuid')
  deleteCaseDocument(
    @Param('userUuid') userUuid: string,
    @Param('documentUuid') documentUuid: string,
    @Query('agentUserUuid') agentUserUuid: string,
  ) {
    return this.agentService.deleteCaseDocument(agentUserUuid, userUuid, documentUuid);
  }

  @Get(':agentUuid/reviews')
  getReviews(@Param('agentUuid') agentUuid: string) {
    return this.agentService.getAgentReviews(agentUuid);
  }
}