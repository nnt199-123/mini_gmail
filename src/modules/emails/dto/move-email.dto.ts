import { IsUUID } from 'class-validator';

export class MoveEmailDto {
  @IsUUID()
  folderId: string;
}
