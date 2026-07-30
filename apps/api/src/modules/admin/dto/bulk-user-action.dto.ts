import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class BulkUserActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  ids!: string[];
}
