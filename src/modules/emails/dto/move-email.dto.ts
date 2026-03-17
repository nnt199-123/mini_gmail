import { IsOptional, IsUUID } from 'class-validator';

export class MoveEmailDto {
  @IsUUID()
  folderId: string;

  @IsOptional()
  @IsUUID()
  sourceFolderId?: string;
}
