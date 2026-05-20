import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MasterCodeService } from '../services/master-code.service';
import { ToastService } from '../services/toast.service';

export const masterCodeGuard: CanActivateFn = async (route, state) => {
  const masterCodeService = inject(MasterCodeService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Check if blocked
  if (masterCodeService.isBlocked()) {
    toast.error({
      title: 'تم حظر الوصول',
      message: 'تم حظر IP الخاص بك بسبب محاولات خاطئة متعددة. تواصل مع المسؤول.',
      duration: 10000,
    });
    router.navigate(['/admin/dashboard']);
    return false;
  }

  const isVerified = await masterCodeService.verifyMasterCode();

  if (!isVerified) {
    // Check if blocked after failed attempts
    if (masterCodeService.isBlocked()) {
      toast.error({
        title: 'تم حظرك نهائياً',
        message: 'تم حظر IP الخاص بك بسبب 3 محاولات خاطئة.',
        duration: 10000,
      });
    }

    // Redirect back to dashboard if user cancels or enters wrong code
    router.navigate(['/admin/dashboard']);
    return false;
  }

  toast.success({
    title: 'تم التحقق',
    message: 'تم التحقق من الماستر كود بنجاح',
    duration: 3000,
  });

  return true;
};
