package com.medicareplus.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class Dates {
    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);

    private Dates() {
    }

    /** e.g. "Tue, 6 Oct 2026" - used in notification texts. */
    public static String display(LocalDate d) {
        return DISPLAY.format(d);
    }
}
