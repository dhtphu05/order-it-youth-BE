import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { PosQuickOrderDto } from './dto/pos-quick-order.dto';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Public – POS')
@Controller('pos/orders')
export class PosController {
    constructor(private readonly service: PosService) { }

    @Post('quick')
    @Public() // This decorator (if exists) or manual exclusion from Guards needed
    @ApiOperation({
        summary: 'Quick create order (Public POS)',
        description:
            'Create an order quickly with minimal info. No login required.',
    })
    @ApiBody({ type: PosQuickOrderDto })
    @ApiResponse({
        status: 201,
        description: 'Order created.',
        type: OrderResponseDto,
    })
    quickCreate(@Body() dto: PosQuickOrderDto) {
        return this.service.quickCreate(dto);
    }

    @Get('teams')
    @Public()
    @ApiOperation({ summary: 'List active teams (Public)' })
    getTeams() {
        return this.service.getTeams();
    }

    @Get('teams/:id/members')
    @Public()
    @ApiOperation({ summary: 'List members of a team (Public)' })
    getTeamMembers(@Param('id') id: string) {
        return this.service.getTeamMembers(id);
    }
}
