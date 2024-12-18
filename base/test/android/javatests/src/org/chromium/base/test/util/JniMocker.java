// Copyright 2018 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

package org.chromium.base.test.util;

import org.jni_zero.JniStaticTestMocker;
import org.junit.rules.ExternalResource;

import java.util.ArrayList;

/** A test rule to set up and tear down native implementation mocks. */
public class JniMocker extends ExternalResource {
    private final ArrayList<JniStaticTestMocker> mHooks = new ArrayList<>();

    /**
     * Sets the native implementation of the class using a JniStaticTestMocker
     *
     * <p>All TEST_HOOKS set with this function will have their test instance set to null after each
     * test is run.
     *
     * @param hook Instance of the corresponding JniStaticTestMocker in the wrapper class generated
     *     by the JNI annotation processor
     * @param testInst Mock instance of type T which will be set as the native implementation to be
     *     used in tests.
     */
    public <T> void mock(JniStaticTestMocker<T> hook, T testInst) {
        hook.setInstanceForTesting(testInst);
        mHooks.add(hook);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void after() {
        for (JniStaticTestMocker hook : mHooks) {
            hook.setInstanceForTesting(null);
        }
        mHooks.clear();
    }
}
