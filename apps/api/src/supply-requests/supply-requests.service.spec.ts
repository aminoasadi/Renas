import { SupplyRequestsService } from "./supply-requests.service";
import { testPrisma } from "../../test/test-helpers";

describe("SupplyRequestsService (real Postgres)", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    for (const id of createdIds.splice(0)) {
      await testPrisma.supplyRequestNote.deleteMany({ where: { supplyRequestId: id } });
      await testPrisma.supplyRequest.delete({ where: { id } }).catch(() => undefined);
    }
  });

  it("persists the request", async () => {
    const service = new SupplyRequestsService(testPrisma as never);

    const result = await service.submit({
      productName: "Brake Disc — Test",
      contactName: "Jane Test",
      contactEmail: "jane-test@example.com",
      honeypot: "",
      turnstileToken: undefined,
    } as never);

    createdIds.push(result.id);

    const stored = await testPrisma.supplyRequest.findUniqueOrThrow({ where: { id: result.id } });
    expect(stored.productName).toBe("Brake Disc — Test");
    expect(stored.status).toBe("NEW");
  });

  it("a honeypot-triggered submission is accepted-looking but never persisted", async () => {
    const service = new SupplyRequestsService(testPrisma as never);

    const countBefore = await testPrisma.supplyRequest.count();
    const result = await service.submit({
      productName: "Bot Submission",
      contactName: "Bot",
      honeypot: "I am a bot",
    } as never);
    const countAfter = await testPrisma.supplyRequest.count();

    expect(result.accepted).toBe(true);
    expect(countAfter).toBe(countBefore);
  });

  it("status can be updated and defaults to NEW", async () => {
    const service = new SupplyRequestsService(testPrisma as never);
    const result = await service.submit({
      productName: "Filter — Test",
      contactName: "John Test",
      contactPhone: "+10000000000",
      honeypot: "",
    } as never);
    createdIds.push(result.id);

    const updated = await service.updateStatus(result.id, "REVIEWING");
    expect(updated.status).toBe("REVIEWING");
  });
});
