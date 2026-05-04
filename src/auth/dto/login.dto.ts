import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@grupoaral.com',
    description: 'Correo electrónico o teléfono celular',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    example: 'admin@grupoaral.com',
    description: 'Alias legacy para identifier',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Admin123*' })
  @IsString()
  @MinLength(6)
  password: string;
}
