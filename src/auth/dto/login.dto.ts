import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty()
  passwordHash: string; // Nota: El endpoint recibe el texto plano, pero se nombra mapeando al campo o lógica correspondiente.
}
