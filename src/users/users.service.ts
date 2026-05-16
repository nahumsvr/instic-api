import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private sanitizeUser(user: User): User {
    const { password, ...result } = user;
    return result as User;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validar si el rol existe en el Enum (por precaución adicional)
    if (!Object.values(Role).includes(createUserDto.role)) {
      throw new BadRequestException(
        `El rol '${createUserDto.role}' no existe o no está permitido`,
      );
    }

    // Validar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException(
        `El usuario '${createUserDto.username}' ya existe`,
      );
    }

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Crear el usuario con la contraseña hasheada
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.sanitizeUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Al usar findOne, el usuario devuelto ya viene sin la contraseña.
    // Necesitamos obtenerlo completo si queremos hacer validaciones previas, pero para un update parcial con save() de TypeORM, no es estrictamente necesario tenerla, a menos que modifiquemos la contraseña.
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false; // Soft delete
    await this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }
}
