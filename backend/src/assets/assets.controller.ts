import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.assetsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status, search, category,
    });
  }

  @Get('stats')
  getStats() {
    return this.assetsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.assetsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.assetsService.update(id, body);
  }

  @Post(':id/link-device')
  linkDevice(@Param('id') id: string, @Body() body: { deviceId?: string; serialNumber?: string }) {
    return this.assetsService.linkDevice(id, body);
  }
}
