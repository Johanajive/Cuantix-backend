import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finance } from '../../entities/finance.entity';
import { Users } from '../../entities/user.entity';
import { CreateFinanceDto } from './dto/CreateFinance.Dto';
import { UpdateFinanceDto } from './dto/UpdateFinanceDto';
import { FinanceType } from '../../enums/financeType.enum';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  // Obtener bolsillo por UUID
  async getFinanceById(uuid: string) {
    const finance = await this.financeRepository.findOne({
      where: { uuid: uuid },
      relations: ['user', 'investment'], // CARGA RELACIONES COMPLETAS
    });

    if (!finance) {
      throw new NotFoundException(`El bolsillo con id ${uuid} no existe`);
    }

    return finance;
  }

  // Obtener bolsillos por usuario (JWT)
  async getFinanceByUser(userId: string, filter?: string) {
  const query = this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId });

  const today = new Date();

  if (filter === 'day') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    query.andWhere('finance.createdAt BETWEEN :start AND :end', {
      start,
      end,
    });
  }

  if (filter === 'week') {
    const start = new Date();
    start.setDate(today.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    query.andWhere('finance.createdAt >= :start', { start });
  }

  if (filter === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    query.andWhere('finance.createdAt BETWEEN :start AND :end', {
      start,
      end,
    });
  }

  return query.orderBy('finance.createdAt', 'DESC').getMany();
}


  // Obtener bolsillos por tipo
  async getFinanceByType(type: string) {
    return this.financeRepository.find({
      where: {
        financeType: type as FinanceType,
      },
    });
  }

  //  CREAR BOLSILLO (PRO)
  async create(createFinanceDto: CreateFinanceDto, userId: string) {
  const user = await this.usersRepository.findOne({
    where: { uuid: userId },
  });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  // ✅ crear fecha en UTC correctamente
  const [year, month, day] = createFinanceDto.date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  // ✅ ahora crear el finance
  const finance = this.financeRepository.create({
  called: createFinanceDto.called,
  amount: createFinanceDto.amount,
  date: createFinanceDto.date, // string directo
  financeType: createFinanceDto.financeType,
  user: user,
});

  return this.financeRepository.save(finance);
}
  // Actualizar bolsillo
  async update(
  uuid: string,
  updateFinanceDto: UpdateFinanceDto,
  userId: string,
) {
  const finance = await this.financeRepository.findOne({
    where: { uuid: uuid },
    relations: ['user', 'investment'], // CARGA RELACIONES COMPLETAS
  });

  if (!finance) {
    throw new NotFoundException('Bolsillo no encontrado');
  }

  // 🔥 AQUÍ ESTÁ LA SEGURIDAD REAL
  if (finance.user.uuid !== userId) {
    throw new ForbiddenException(
      'No tienes permiso para modificar este bolsillo',
    );
  }

  Object.assign(finance, updateFinanceDto);
  return this.financeRepository.save(finance);
}


  // Eliminar bolsillo
  async remove(uuid: string, userId: string) {
  const finance = await this.financeRepository.findOne({
    where: { uuid: uuid },
    relations: ['user', 'investment'], // CARGA RELACIONES COMPLETAS
  });

  if (!finance) {
    throw new NotFoundException('Bolsillo no encontrado');
  }

  //  VALIDACIÓN DE PROPIETARIO
  if (finance.user.uuid !== userId) {
    throw new ForbiddenException(
      'No tienes permiso para eliminar este bolsillo',
    );
  }

  await this.financeRepository.remove(finance);

  return {
    message: `El bolsillo con id ${uuid} fue eliminado correctamente`,
  };
}
}