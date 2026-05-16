import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty()
  passwordHash: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsInt()
  @IsOptional()
  baseLocationId?: number;
}
