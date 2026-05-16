import { IsNotEmpty, IsString } from 'class-validator';

export class CancelMovementDto {
  @IsString()
  @IsNotEmpty({ message: 'Se debe especificar un motivo de anulación' })
  cancelReason: string;
}
