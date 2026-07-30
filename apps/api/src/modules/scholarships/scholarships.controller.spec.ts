import { ForbiddenException } from "@nestjs/common";
import { ScholarshipType } from "@scholarship/database";
import { ScholarshipsController } from "./scholarships.controller";

describe("ScholarshipsController partner KYC enforcement", () => {
  const body = {
    organizationId: "4c391c44-408b-4cd6-88c8-bce981d3fc33",
    title: "Học bổng đối tác đã xác minh",
    summary: "Chương trình hỗ trợ ứng viên có thành tích nổi bật.",
    description: "Thông tin chi tiết và đầy đủ về chương trình học bổng đối tác.",
    type: ScholarshipType.FULL,
  };

  function controllerWithStatus(status: "PENDING" | "VERIFIED", deletedAt: Date | null = null) {
    const client = {
      organizationMember: {
        findUnique: jest.fn().mockResolvedValue({
          organization: { status, deletedAt },
        }),
      },
      scholarship: {
        create: jest.fn().mockResolvedValue({ id: "scholarship-1", ...body }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" }),
      },
    };
    return {
      client,
      controller: new ScholarshipsController({ client } as never),
    };
  }

  it("rejects scholarship creation when the organization is not VERIFIED", async () => {
    const { controller, client } = controllerWithStatus("PENDING");
    await expect(controller.create(body, {
      user: { sub: "partner-1", role: "PARTNER" },
    } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(client.scholarship.create).not.toHaveBeenCalled();
  });

  it("allows a PARTNER member of a VERIFIED organization", async () => {
    const { controller, client } = controllerWithStatus("VERIFIED");
    await expect(controller.create(body, {
      user: { sub: "partner-1", role: "PARTNER" },
    } as never)).resolves.toMatchObject({ id: "scholarship-1" });
    expect(client.scholarship.create).toHaveBeenCalledTimes(1);
    expect(client.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
