import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";
import {
  NOTIFY_QUEUE_NAME,
  SEND_REGISTER_OTP_JOB,
  type RegisterChannel,
} from "../types/register.types";

interface SendRegisterOtpJob {
  channel: RegisterChannel;
  recipient: string;
  otp: string;
  purpose: "REGISTER_VERIFY";
}

@Injectable()
export class OtpQueueProducer {
  constructor(
    @InjectQueue(NOTIFY_QUEUE_NAME) private readonly notifyQueue: Queue<SendRegisterOtpJob>,
  ) {}

  async enqueueRegisterOtp(payload: SendRegisterOtpJob): Promise<void> {
    // OTP is present only in the transient queue payload for delivery.
    // removeOnComplete prevents long-term storage after the notification worker succeeds.
    await this.notifyQueue.add(SEND_REGISTER_OTP_JOB, payload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}
