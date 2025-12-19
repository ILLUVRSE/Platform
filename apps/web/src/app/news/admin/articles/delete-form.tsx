import { deleteArticle } from '@news/lib/actions';

export default function DeleteForm({ id }: { id: string }) {
  const handleDelete = async (formData: FormData) => {
    'use server';
    await deleteArticle(formData);
  };

  return (
    <form action={handleDelete}>
      <input type="hidden" name="articleId" value={id} />
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.18em] text-rose-600 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--forest)]"
      >
        Delete
      </button>
    </form>
  );
}
