from django.db import migrations, models


def criar_relacao_empresas(apps, schema_editor):
    connection = schema_editor.connection
    quote = schema_editor.quote_name
    through_table = quote("Elion_usuariosistema_empresas")
    usuario_table = quote("Elion_usuariosistema")
    empresa_table = quote("Elion_empresa")

    with connection.cursor() as cursor:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {through_table} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuariosistema_id bigint NOT NULL REFERENCES {usuario_table}(id) DEFERRABLE INITIALLY DEFERRED,
                empresa_id bigint NOT NULL REFERENCES {empresa_table}(id) DEFERRABLE INITIALLY DEFERRED
            )
        """)
        cursor.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS Elion_usuariosistema_empresas_uidx ON {through_table}(usuariosistema_id, empresa_id)"
        )
        cursor.execute(
            f"CREATE INDEX IF NOT EXISTS Elion_usuariosistema_empresas_usuario_idx ON {through_table}(usuariosistema_id)"
        )
        cursor.execute(
            f"CREATE INDEX IF NOT EXISTS Elion_usuariosistema_empresas_empresa_idx ON {through_table}(empresa_id)"
        )
        cursor.execute(
            f"INSERT OR IGNORE INTO {through_table}(usuariosistema_id, empresa_id) "
            f"SELECT id, empresa_id FROM {usuario_table} WHERE empresa_id IS NOT NULL"
        )
        cursor.execute(f"SELECT id FROM {empresa_table} ORDER BY id")
        empresas = [row[0] for row in cursor.fetchall()]
        if empresas:
            cursor.execute(
                f"SELECT id FROM {usuario_table} WHERE administrador_geral = 1"
            )
            admins = [row[0] for row in cursor.fetchall()]
            for usuario_id in admins:
                for empresa_id in empresas:
                    cursor.execute(
                        f"INSERT OR IGNORE INTO {through_table}(usuariosistema_id, empresa_id) VALUES (?, ?)",
                        [usuario_id, empresa_id],
                    )


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0008_manutencao_frota"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(criar_relacao_empresas, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="usuariosistema",
                    name="empresa",
                ),
                migrations.AddField(
                    model_name="usuariosistema",
                    name="empresas",
                    field=models.ManyToManyField(
                        blank=True,
                        related_name="usuarios_sistema",
                        to="Elion.empresa",
                        verbose_name="Empresas",
                    ),
                ),
            ],
        ),
    ]
