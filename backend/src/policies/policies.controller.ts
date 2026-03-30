import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async getPolicies(@Query('orgUnitPath') orgUnitPath?: string) {
    try {
      return await this.policiesService.getPolicies(orgUnitPath);
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  }

  @Post('update')
  async updatePolicy(
    @Body() payload: { orgUnitPath: string; schema: string; value: any; updateMask: string },
  ) {
    return this.policiesService.updatePolicy(
      payload.orgUnitPath,
      payload.schema,
      payload.value,
      payload.updateMask,
    );
  }

  @Get('org-units')
  async getOrgUnits() {
    try {
      return await this.policiesService.getOrgUnits();
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  }
}
