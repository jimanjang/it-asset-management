import { Body, Controller, Get, Param, Put, Post, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('hasAsset') hasAsset?: string,
    @Query('inactiveDays') inactiveDays?: number,
  ) {
    return this.devicesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
      sortBy,
      sortOrder,
      hasAsset,
      inactiveDays: inactiveDays ? Number(inactiveDays) : undefined,
    });
  }

  @Get('stats')
  async getStats() {
    return this.devicesService.getStats();
  }

  @Get('problems')
  async getProblems() {
    return this.devicesService.getProblematicDevices();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get(':id/metrics')
  async getMetrics(
    @Param('id') id: string,
    @Query('range') range?: string,
  ) {
    return this.devicesService.findMetrics(id, range);
  }

  @Put(':id/custom-fields')
  async updateCustomFields(
    @Param('id') id: string,
    @Body() payload: { annotatedUser?: string; annotatedAssetId?: string; annotatedLocation?: string; notes?: string },
  ) {
    return this.devicesService.updateCustomFields(id, payload);
  }

  @Get(':id/reports')
  async getReports(@Param('id') id: string) {
    return this.devicesService.getChromeReports(id);
  }

  @Get('activities/all')
  async getAllActivities(@Query('limit') limit?: number) {
    return this.devicesService.getAllChromeReports(limit);
  }

  @Post('hardware-info')
  async updateHardwareInfo(
    @Body() payload: { googleDeviceId: string; serialNumber: string; manufacturer: string; model: string },
  ) {
    return this.devicesService.updateHardwareInfo(payload);
  }
}
