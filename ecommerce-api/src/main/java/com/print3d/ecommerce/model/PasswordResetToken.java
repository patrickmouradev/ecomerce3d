package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_password_reset_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    @Column(nullable = false)
    private boolean used = false;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
