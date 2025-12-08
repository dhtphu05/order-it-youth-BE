
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { TeamShipmentsService } from './team-shipments.service';

export class PublicAssignShipperDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    order_code: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    shipper_id: string;
}

@ApiTags('public-shipments')
@Controller('public/shipments')
export class PublicShipmentsController {
    constructor(private readonly teamShipmentsService: TeamShipmentsService) { }

    @Post('assign')
    @ApiOperation({ summary: 'Publicly assign a shipper to a newly created quick order' })
    async assignShipper(@Body() dto: PublicAssignShipperDto) {
        return this.teamShipmentsService.publicAssignShipper(dto.order_code, dto.shipper_id);
    }
}
