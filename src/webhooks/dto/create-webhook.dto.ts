import { ArrayMinSize, IsArray, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ description: 'URL HTTPS donde CobraPy enviará el evento.', example: 'https://miapp.com/webhooks/cobrapy' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({
    description: 'Eventos a los que suscribirse.',
    isArray: true,
    type: String,
    example: ['charge.paid', 'charge.expired'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];
}
